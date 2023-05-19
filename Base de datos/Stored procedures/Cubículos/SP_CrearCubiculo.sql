--------------------------------------------------------------------------
-- Autor:       Paúl Rodríguez García
-- Fecha:       2023-05-18
-- Descripción: Procedimiento para crear un cubículo
--------------------------------------------------------------------------

CREATE OR ALTER PROCEDURE [dbo].[BiblioTEC_SP_CrearCubiculo]
    @IN_nombreNuevo         VARCHAR(16),
    @IN_capacidad           INT,
    @IN_estadoNuevo         VARCHAR(32),
    @IN_minutosMaximo       INT,
    @IN_servicios           TVP_Servicios READONLY
AS
BEGIN
    SET NOCOUNT ON;         -- No retorna metadatos

    -- CONTROL DE ERRORES
    DECLARE @ErrorNumber INT, @ErrorSeverity INT, @ErrorState INT, @Message VARCHAR(200);
    DECLARE @transaccion_iniciada BIT = 0;

    -- DECLARACIÓN DE VARIABLES
    DECLARE @DESCRIPCION_ELIMINADO VARCHAR(32) = 'Eliminado';
    DECLARE @tmpServicios TABLE (
        [id]    INT
    );
    DECLARE @servicioInvalido VARCHAR(32) = '';
    DECLARE @idEstado INT = NULL;
    DECLARE @idCubiculo INT = NULL;

    BEGIN TRY

        -- VALIDACIONES
        
        -- ¿Existe el estado?
        SELECT  @idEstado = COALESCE(E.[id], NULL)
        FROM    [dbo].[EstadosCubiculo] E
        WHERE   E.[descripcion] = @IN_estadoNuevo
            AND E.[descripcion] != @DESCRIPCION_ELIMINADO;

        IF @idEstado IS NULL
        BEGIN
            RAISERROR('El estado "%s" no existe', 16, 1, @IN_estadoNuevo);
        END;

        -- ¿Ya hay uno con ese nombre?
        IF EXISTS(  SELECT  C.[nombre]
                    FROM    [dbo].[Cubiculos] C
                    INNER JOIN [dbo].[EstadosCubiculo] EC
                        ON  C.[idEstado] = EC.[id]
                    WHERE   C.[nombre] = @IN_nombreNuevo
                        AND EC.[descripcion] != @DESCRIPCION_ELIMINADO  )
        BEGIN
            -- Ya hay un cubículo con el mismo nombre
            RAISERROR('Ya existe otro cubículo con el nombre "%s"', 16, 1, @IN_nombreNuevo);
        END;

        -- ¿La capacidad es válida?
        IF @IN_capacidad < 1
        BEGIN
            RAISERROR('La capacidad "%d" no es válida', 16, 1, @IN_capacidad);
        END;

        -- ¿Los servicios son válidos?
        INSERT INTO @tmpServicios ([id])
        SELECT  S.[id]
        FROM    [dbo].[ServiciosEspeciales] S
        INNER JOIN @IN_servicios i_S
            ON  S.[descripcion] = i_s.[descripcion];

        IF (SELECT COUNT(*) FROM @IN_servicios) > (SELECT COUNT(*) FROM @tmpServicios)
        BEGIN
            -- Si entra acá, algún servicio no existe
            SET @servicioInvalido = (
                SELECT TOP 1
                        i_S.[descripcion]
                FROM    @IN_servicios i_S
                LEFT JOIN [dbo].[ServiciosEspeciales] S
                    ON  S.[descripcion] = i_S.[descripcion]
                WHERE   S.[descripcion] IS NULL
            );
            RAISERROR('El servicio "%s" no existe', 16, 1, @servicioInvalido);
        END;

        -- INICIO DE LA TRANSACCIÓN
        IF @@TRANCOUNT = 0
        BEGIN
            SET @transaccion_iniciada = 1;
            BEGIN TRANSACTION;
        END;

            INSERT INTO [dbo].[Cubiculos]
            (
                [idEstado],
                [nombre],
                [capacidad],
                [minutosMax]
            )
            VALUES
            (
                @idEstado,
                @IN_nombreNuevo,
                @IN_capacidad,
                @IN_minutosMaximo
            );

            SET @idCubiculo = SCOPE_IDENTITY();

            INSERT INTO [ServiciosDeCubiculo]
            (
                [idCubiculo],
                [idServiciosEspeciales],
                [activo]
            )
            SELECT  @idCubiculo,
                    tS.[id],
                    1
            FROM    @tmpServicios tS;

        -- COMMIT DE LA TRANSACCIÓN
        IF @transaccion_iniciada = 1
        BEGIN
            COMMIT TRANSACTION;
        END;

    END TRY
    BEGIN CATCH

        SET @ErrorNumber = ERROR_NUMBER();
        SET @ErrorSeverity = ERROR_SEVERITY();
        SET @ErrorState = ERROR_STATE();
        SET @Message = ERROR_MESSAGE();

        IF @transaccion_iniciada = 1
        BEGIN
            ROLLBACK;
        END;

        IF @ErrorNumber != 50000
        BEGIN
            -- Si no es un error personalizado, se registra el error
            INSERT INTO [dbo].[Errors]
            VALUES (
                SUSER_NAME(),
                ERROR_NUMBER(),
                ERROR_STATE(),
                ERROR_SEVERITY(),
                ERROR_LINE(),
                ERROR_PROCEDURE(),
                ERROR_MESSAGE(),
                GETUTCDATE()
            );
        END;

        RAISERROR('%s - Error Number: %i', 
            @ErrorSeverity, @ErrorState, @Message, @ErrorNumber);

    END CATCH;
END;