--------------------------------------------------------------------------
-- Autor:       Paúl Rodríguez García
-- Fecha:       2023-05-18
-- Descripción: Procedimiento para crear una reserva
--------------------------------------------------------------------------

CREATE OR ALTER PROCEDURE [dbo].[BiblioTEC_SP_HacerReserva]
    @IN_idCubiculo          INT,
    @IN_idEstudiante        INT,
    @IN_horaInicio          DATETIME,
    @IN_horaFin             DATETIME
AS
BEGIN
    SET NOCOUNT ON;         -- No retorna metadatos

    -- CONTROL DE ERRORES
    DECLARE @ErrorNumber INT, @ErrorSeverity INT, @ErrorState INT, @Message VARCHAR(200);
    DECLARE @transaccion_iniciada BIT = 0;

    -- DECLARACIÓN DE VARIABLES
    DECLARE @DESCRIPCION_ELIMINADO VARCHAR(32) = 'Eliminado';
    DECLARE @DESCRIPCION_DISPONIBLE VARCHAR(32) = 'Habilitado';

    BEGIN TRY

        -- VALIDACIONES
        
        -- Verifica si existe el cubículo
        IF NOT EXISTS ( SELECT  1
                        FROM    [dbo].[Cubiculos] C
                        INNER JOIN  [dbo].[EstadosCubiculo] EC
                            ON  C.[idEstado] = EC.[id]
                        WHERE   C.[id] = @IN_idCubiculo
                            AND EC.[descripcion] != @DESCRIPCION_ELIMINADO )
        BEGIN
            RAISERROR('No existe ningún cubículo con el ID %d', 16, 1, @IN_idCubiculo);
        END;

        -- Verifica si está habilitado
        IF NOT EXISTS ( SELECT  1
                        FROM    [dbo].[Cubiculos] C
                        INNER JOIN  [dbo].[EstadosCubiculo] EC
                            ON  C.[idEstado] = EC.[id]
                        WHERE   C.[id] = @IN_idCubiculo
                            AND EC.[descripcion] = @DESCRIPCION_DISPONIBLE )
        BEGIN
            RAISERROR('El cubículo con ID %d no está habilitado para su uso', 16, 1, @IN_idCubiculo);
        END;

        -- Verifica que las horas sean válidas
        IF @IN_horaInicio >= @IN_horaFin
        BEGIN
            RAISERROR('La hora de inicio no puede ser mayor o igual que la hora de fin', 16, 1);
        END;

        IF @IN_horaInicio < GETUTCDATE()
        BEGIN
            RAISERROR('La hora de inicio no puede ser anterior a la hora actual', 16, 1);
        END;

        -- Verifica que no haya choques
        IF [dbo].[BiblioTEC_FUNC_Choques](@IN_horaInicio, @IN_horaFin, NULL, @IN_idCubiculo) = 1
        BEGIN
            RAISERROR('Hay un choque con otra reserva en el cubículo seleccionado', 16, 1);
        END;

        IF [dbo].[BiblioTEC_FUNC_Choques](@IN_horaInicio, @IN_horaFin, @IN_idEstudiante, NULL) = 1
        BEGIN
            RAISERROR('Hay un choque con otra reserva del estudiante', 16, 1);
        END;

        -- Verifica que el tiempo no sea mayor al tiempo máximo del cubículo
        IF DATEDIFF(MINUTE, @IN_horaInicio, @IN_horaFin) > (
            SELECT  C.[minutosMax]
            FROM    [dbo].[Cubiculos] C
            WHERE   C.[id] = @IN_idCubiculo
        )
        BEGIN
            RAISERROR('La reserva excede el tiempo de uso máximo del cubículo', 16, 1);
        END;

        -- INICIO DE LA TRANSACCIÓN
        IF @@TRANCOUNT = 0
        BEGIN
            SET @transaccion_iniciada = 1;
            BEGIN TRANSACTION;
        END;

            INSERT INTO [dbo].[Reservas]
            (
                [idCubiculo],
                [idEstudiante],
                [fecha],
                [horaInicio],
                [horaFin],
                [activo],
                [confirmado],
                [eliminada]
            )
            VALUES  (
                @IN_idCubiculo,
                @IN_idEstudiante,
                GETUTCDATE(),
                @IN_horaInicio,
                @IN_horaFin,
                1,
                0,
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