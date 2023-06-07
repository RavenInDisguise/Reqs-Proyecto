--------------------------------------------------------------------------
-- Autor:       Fabián Vargas
-- Fecha:       2023-05-18
-- Descripción: Procedimiento para crear un estudiante
--------------------------------------------------------------------------

CREATE OR ALTER PROCEDURE [dbo].[BiblioTEC_SP_CrearEstudiante]
    @IN_Nombre VARCHAR(32),
    @IN_Apellido1 VARCHAR(16),
    @IN_Apellido2 VARCHAR(16),
    @IN_Cedula INT,
    @IN_Carnet INT,
    @IN_Correo VARCHAR(128),
    @IN_FechaNacimiento DATE,
    @IN_Clave VARCHAR(64)
AS
BEGIN
    SET NOCOUNT ON;         -- No retorna metadatos

    -- CONTROL DE ERRORES
    DECLARE @ErrorNumber INT, @ErrorSeverity INT, @ErrorState INT, @Message VARCHAR(200);
    DECLARE @transaccion_iniciada BIT = 0;

    -- DECLARACIÓN DE VARIABLES
    DECLARE @idUsuario INT
    DECLARE @DESCRIPCION_ESTUDIANTE VARCHAR(16) = 'Estudiante';
    DECLARE @idTipoEstudiante INT; 

    BEGIN TRY

        -- VALIDACIONES

        SELECT  @idTipoEstudiante = TU.[id]
        FROM    [dbo].[TiposUsuario] TU
        WHERE   TU.[descripcion] = @DESCRIPCION_ESTUDIANTE;

        IF EXISTS(  SELECT 1 
                    FROM [Usuarios] U
                    INNER JOIN [Estudiantes] E
                        ON  E.[idUsuario] = U.[id]
                    WHERE U.[correo] = @IN_Correo
                    AND E.[eliminado] = 0 )
        BEGIN
            RAISERROR('Ya existe un usuario con el correo %s',16,1,@IN_Correo)
        END

        IF (@IN_correo NOT LIKE '%@estudiantec.cr')
        BEGIN
            RAISERROR('El correo %s no pertenece al dominio @estudiantec.cr', 16, 1, @IN_Correo);
        END

        IF EXISTS(  SELECT 1 
                    FROM [Estudiantes] E
                    WHERE E.[Cedula] = @IN_Cedula
                    AND E.[eliminado] = 0 )
        BEGIN
            RAISERROR('Ya existe un estudiante registrado con la cedula %d', 16, 1, @IN_Cedula)
        END

        IF EXISTS(  SELECT 1 
                    FROM [Estudiantes] E
                    WHERE E.[Carnet] = @IN_Carnet
                    AND E.[eliminado] = 0 )
        BEGIN
            RAISERROR('Ya existe un estudiante registrado con el carnet %d', 16, 1, @IN_Carnet)
        END

        -- INICIO DE LA TRANSACCIÓN
        IF @@TRANCOUNT = 0
        BEGIN
            SET @transaccion_iniciada = 1;
            BEGIN TRANSACTION;
        END;

        INSERT INTO Usuarios 
        (
            correo, 
            clave, 
            idTipoUsuario
        ) 
        VALUES 
        (
            @IN_Correo,
            @IN_Clave,
            @idTipoEstudiante

        )

        SET @idUsuario = SCOPE_IDENTITY() 

        INSERT INTO Estudiantes 
        (
            nombre, 
            apellido1, 
            apellido2, 
            cedula, 
            carnet, 
            fechaDeNacimiento, 
            idUsuario,
            activo,
            eliminado
        ) 
        VALUES
        (
            @IN_Nombre,
            @IN_Apellido1,
            @IN_Apellido2,
            @IN_Cedula,
            @IN_Carnet,
            @IN_FechaNacimiento,
            @idUsuario, 
            1,
            0
        )

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